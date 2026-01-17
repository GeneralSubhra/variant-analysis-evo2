export interface GenomeAssemblyFromSearch {
    id: string;
    name: string;
    sourceName: string;
    active: boolean;
}
export async function getAvailableGenomes() {
    const apiURL = "http://api.genome.ucsc.edu/list/ucscGenomes";
    const response = await fetch(apiURL);

    if (!response.ok) {
        throw new Error("Failed to fetch genomes from UCSC API");
    }

    const genomeData = await response.json();
    if (!genomeData) {
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
    return structuredGenome;
}
