"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { getAvailableGenomes } from "~/utils/genome-api";

export default function HomePage() {
  useEffect(() => {
    const fetchGenomes = async () => {
      const data = await getAvailableGenomes();
      console.log(data.genomes["Human"]);
    }
    fetchGenomes();
  }, [])
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
      </Card>
    </main>
  </div>;

}
