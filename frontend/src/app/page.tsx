"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select } from "~/components/ui/select";
import {
  type GenomeAssemblyFromSearch,
  getAvailableGenomes
} from "~/utils/genome-api";

export default function HomePage() {
  const [genomes, setGenomes] = useState<GenomeAssemblyFromSearch[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<string>("hg38");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        setIsLoading(true);
        const data = await getAvailableGenomes();
        if (data.genomes && data.genomes["Human"]) {
          setGenomes(data.genomes["Human"]);
        }
      } catch (err) {
        setError("Failed to load Genome data")
      } finally {
        setIsLoading(false);
      }
    }
    fetchGenomes();
  }, [])

  const handleGenomeChange = (value: string) => {
    setSelectedGenome(value);
  }
  
  return <div className="min-h-screen bg-[#e6e6e6]" >
    <header className="border-b border-[#3c4f3d]/20 bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <h1 className="text-xl font-light tracking-wide text-[#3c4f3d]">
              <span className="font-normal">Evo</span>
              <span className="font-semibold text-[#4c00ff]">2</span>
            </h1>
            <div className="absolute -bottom-1 left-0 h-[2px] w-12 bg-[#4c00ff]"></div>
          </div>
          <span className="text-sm font-light text-[#3c4f3d]/70">DNA Variant Analysis</span>
        </div>
      </div>
    </header>
    <main className="container mx-auto px-6 py-6">
      <Card className="mb-3 gap-0 border-none bg-white shadow-sm">
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal text-[#3c4f3d]/80">
              Genome Assembly
            </CardTitle>
            <div className="text-sm font-light text-[#3c4f3d]/80">
              Organism : <span className="font-semibold">Human</span></div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <Select value={selectedGenome} onValueChange={handleGenomeChange}></Select>
        </CardContent>
      </Card>
    </main>
  </div>;

}
