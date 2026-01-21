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
