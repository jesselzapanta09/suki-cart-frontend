import { Button, Spin } from "antd";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";

export default function Popular({ products, onAdd }) {
    const navigate = useNavigate();
    const isLoading = products === null;

    return (
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <SectionHeading tag="Trending" title="Popular Products" subtitle="Best-selling items loved by your community" />
                {isLoading ? (
                    <div className="flex min-h-64 items-center justify-center rounded-2xl bg-white">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                type="text"
                                icon={<ArrowRight size={16} />}
                                iconPlacement="end"
                                onClick={() => navigate("/search?sort=popular")}
                            >
                                View more
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
