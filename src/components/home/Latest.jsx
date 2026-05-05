import { Button, Spin } from "antd";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default function Latest({ products, onAdd }) {
    const navigate = useNavigate();
    const isLoading = products === null;

    return (
        <section className="bg-white px-4 py-12 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-6xl">
                <SectionHeading
                    tag="New Arrivals"
                    title="Latest Products"
                    subtitle="Fresh additions from verified sellers"
                />
                {isLoading ? (
                    <div className="flex min-h-64 items-center justify-center rounded-2xl bg-gray-50">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} onAdd={onAdd} />
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                type="text"
                                icon={<ArrowRight size={16} />}
                                iconPlacement="end"
                                onClick={() => navigate("/search?sort=latest")}
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
