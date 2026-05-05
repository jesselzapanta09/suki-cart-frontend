import { useEffect, useRef, useState } from "react";
import { Spin } from "antd";
import { ChevronLeft, ChevronRight, ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import { getHomeCategories } from "../../services/categoryService";

export default function Category() {
    const [categories, setCategories] = useState(null);
    const sliderRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        getHomeCategories()
            .then((data) => {
                if (active) {
                    setCategories(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setCategories([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!sliderRef.current || !categories || categories.length === 0) {
            return undefined;
        }

        const slider = sliderRef.current;
        const autoSlide = window.setInterval(() => {
            const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

            if (slider.scrollLeft >= maxScrollLeft - 8) {
                slider.scrollTo({ left: 0, behavior: "smooth" });
                return;
            }

            slider.scrollBy({
                left: 172 * 2,
                behavior: "smooth",
            });
        }, 3000);

        return () => window.clearInterval(autoSlide);
    }, [categories]);

    const scrollByCards = (direction) => {
        if (!sliderRef.current) {
            return;
        }

        const cardWidth = 172;
        sliderRef.current.scrollBy({
            left: direction * cardWidth * 4,
            behavior: "smooth",
        });
    };

    const isLoading = categories === null;

    return (
        <section id="categories" className="bg-white px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10 text-center">
                    <SectionHeading
                        tag="Categories"
                        title="Product by Category"
                        subtitle="Find exactly what you need from fresh local stores"
                    />
                </div>

                <div className="relative">
                    {isLoading ? (
                        <div className="flex min-h-40 items-center justify-center rounded-2xl bg-gray-50">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                aria-label="Scroll categories left"
                                onClick={() => scrollByCards(-1)}
                                className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div
                                ref={sliderRef}
                                className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-14"
                            >
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => navigate(`/categories/${category.id}`)}
                                        className="group flex min-w-40 shrink-0 flex-col items-center gap-3 rounded-2xl bg-gray-50 px-4 py-5 transition-all hover:bg-green-50"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700 transition-colors group-hover:bg-green-200">
                                            <ShoppingBasket size={22} />
                                        </div>
                                        <span className="text-center text-sm font-semibold leading-tight text-gray-700 group-hover:text-green-700">
                                            {category.name}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {category.products_count ?? 0} products
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                aria-label="Scroll categories right"
                                onClick={() => scrollByCards(1)}
                                className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
