import { Chrome } from "lucide-react";
import { symbol } from "zod/v4";

export interface GenomeAssemblyFromSearch {
  id: string;
  name: string;
  sourceName: string;
  active: boolean;
}

export interface ChromosomeFromSearch {
  size: number;
  name: string;
}

export interface GeneFromSearch {
  symbol: string;
  name: string;
  chrom: string;
  description: string;
  GeneID?: string;
}

export interface GeneDetailsFromSearch {
  genomicinfo?: {
    chrstart: number;
    chrstop: number;
    strand?: string;
  }[];
  summary?: string;
  organism?: {
    scientificname: string;
    commonname: string;
  }
}

export interface GeneBound {
  min: number;
  max: number;
}

export async function getAvailableGenomes() {
  const apiURL = "http://api.genome.ucsc.edu/list/ucscGenomes";
  const response = await fetch(apiURL);

  if (!response.ok) {
    throw new Error("Failed to fetch genome list from UCSC API");
  }

  const genomeData = await response.json();
  if (!genomeData.ucscGenomes) {
    throw new Error("UCSC API failure: missing ucscGenomes");
  }

  const genomes = genomeData.ucscGenomes;
  const structuredGenome: Record<string, GenomeAssemblyFromSearch[]> = {};

  for (const genomeId in genomes) {
    const genomeInfo = genomes[genomeId];
    const organism = genomeInfo.organism || "other";

    if (!structuredGenome[organism]) structuredGenome[organism] = [];
    structuredGenome[organism].push({
      id: genomeId,
      name: genomeInfo.description || genomeId,
      sourceName: genomeInfo.sourceName || genomeId,
      active: !!genomeInfo.active, //1 = true, 0 = false
    });
  }
  return {
    genomes: structuredGenome,
  };
}

export async function getGenomeChromosomes(genomeId: string) {
  const apiURL = `http://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`;
  const response = await fetch(apiURL);

  if (!response.ok) {
    throw new Error("Failed to fetch chromosome list from UCSC API");
  }

  const chromosomeData = await response.json();
  if (!chromosomeData.chromosomes) {
    throw new Error("UCSC API failure: missing chromosomes");
  }
  const chromosomes: ChromosomeFromSearch[] = [];
  for (const chromID in chromosomeData.chromosomes) {
    if (
      chromID.includes("_") ||
      chromID.includes("Un") ||
      chromID.includes("random")
    )
      continue;
    chromosomes.push({
      name: chromID,
      size: chromosomeData.chromosomes[chromID],
    });
  }

  //sort chromosomes by size chr1, chr2 ... chrX, chrY
  chromosomes.sort((a, b) => {
    const anum = a.name.replace("chr", "");
    const bnum = b.name.replace("chr", "");
    const isNumA = /^\d+$/.test(anum);
    const isNumB = /^\d+$/.test(bnum);
    if (isNumA && isNumB) return Number(anum) - Number(bnum);
    if (isNumA) return -1;
    if (isNumB) return 1;
    return anum.localeCompare(bnum);
  });
  return { chromosomes };
}


export async function searchGenes(query: string, genome: string) {
  const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";
  const params = new URLSearchParams({
    terms: query,
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
  });
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch gene list from NCBI API");
  }
  const data = await response.json();
  const result: GeneFromSearch[] = [];

  if (data[0] > 0 && data[2]) {
    const fieldMap = data[2];
    const length = fieldMap.Symbol ? fieldMap.Symbol.length : 0;

    for (let i = 0; i < length; i++) {
      let chrom = fieldMap.chromosome[i] || "";
      if (chrom && !chrom.startsWith("chr")) {
        chrom = `chr${chrom}`;
      }

      result.push({
        symbol: fieldMap.Symbol[i],
        name: fieldMap.description[i],
        chrom: chrom,
        description: fieldMap.description[i],
        GeneID: fieldMap.GeneID ? fieldMap.GeneID[i] : "",
      });
    }
  }
  return { result };
}

export async function fetchGeneDetails(geneId: string,): Promise<{
  geneDetails: GeneDetailsFromSearch | null;
  geneBound: GeneBound | null;
  initialRange: { start: number; end: number } | null;

}> {
  try {
    const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const detailsResponse = await fetch(detailsUrl);

    if (!detailsResponse.ok) {
      console.error(`Failed to fetch gene details:${detailsResponse.statusText}`,);

      return { geneDetails: null, geneBound: null, initialRange: null };
    }
    const detailData = await detailsResponse.json()
    if (detailData.result && detailData.result[geneId]) {
      const detail = detailData.result[geneId];
      if (detail.genomicinfo && detail.genomicinfo.length > 0) {
        const info = detail.genomicinfo[0];
        const start = info.chrstart;
        const stop = info.chrstop;
        const strand = info.strand;
        const chr = info.chr;
        const bounds = { min: start, max: stop };
        const geneDetails = { genomicinfo: detail.genomicinfo, summary: detail.summary, organism: detail.organism };

        const minPos = Math.min(start, stop);
        const maxPos = Math.max(start, stop);
        const geneSize = maxPos - minPos;
        const seqStart = minPos;
        const seqEnd = geneSize > 10000 ? minPos + 10000 : maxPos;
        const range = { start: seqStart, end: seqEnd };
        return { geneDetails, geneBound: bounds, initialRange: range };
      }
    }

  } catch (err) {
    return { geneDetails: null, geneBound: null, initialRange: null };
  }

  return { geneDetails: null, geneBound: null, initialRange: null };
}

export async function fetchGeneSequence(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
): Promise<{
  sequence: string;
  actualRange: { start: number; end: number };
  error?: string;
}> {
  try {
    const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`;
    const apiStart = start - 1;
    const apiEnd = end;
    const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const actualRange = { start, end };

    if (data.error || !data.dna) {
      return { sequence: "", actualRange, error: data.error };
    }

    const sequence = data.dna.toUpperCase();

    return { sequence, actualRange };
  } catch (err) {
    return {
      sequence: "",
      actualRange: { start, end },
      error: "Internal error in fetch gene sequence",
    };
  }
}
