import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";

export default function Featured({ products, onAdd }) {
    const [idx, setIdx] = useState(0);
    const perPage = 3;
    const max = Math.max(0, products.length - perPage);

    return (
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <SectionHeading tag="Curated" title="Featured Products" subtitle="Hand-picked selections from our best local sellers" />
                <div>
                    <div className="overflow-hidden rounded-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.slice(idx, idx + perPage).map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-colors cursor-pointer">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setIdx(i => Math.min(max, i + 1))} disabled={idx >= max} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-colors cursor-pointer">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
