import React, { useEffect, useState } from "react";
import { App } from "antd";
import { useCart } from "./context/CartContext";
import { useAuth } from "./context/auth-context";
import { getLatestHomeProducts, getPopularHomeProducts } from "./services/productService";
import Category from "./components/home/Category";
import Popular from "./components/home/Popular";
import Latest from "./components/home/Latest";
import Featured from "./components/home/Featured";
import Slider from "./components/home/Slider";

export default function Home() {
    const { addItem } = useCart();
    const { message } = App.useApp();
    const { isCustomer } = useAuth();
    const [popular, setPopular] = useState(null);
    const [latest, setLatest] = useState(null);

    useEffect(() => {
        let active = true;

        getPopularHomeProducts()
            .then((data) => {
                if (active) {
                    setPopular(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setPopular([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        getLatestHomeProducts()
            .then((data) => {
                if (active) {
                    setLatest(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setLatest([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const handleAdd = async (product) => {
        if (!isCustomer) {
            message.warning("To perform this action, log in as a customer.");
            return;
        }

        const variant = product.variants?.find((item) => Number(item.stock || 0) > 0);

        if (!variant) {
            message.warning("This product has no available variants.");
            return;
        }

        try {
            await addItem({
                ...product,
                rating: product.rating || 0,
                sold: product.sold || 0,
                category: product.category?.name || product.category || "Unknown",
                price: variant.price,
                stock: variant.stock,
                variant_id: variant.id,
                variant,
            }, 1);
            message.success(`${product.name} added to cart!`);
        } catch (error) {
            message.error(error?.data?.error || error?.message || "Failed to add item to cart.");
        }
    };

    console.log("NEW BUILD LOADED 🔥");

    return (
        <div className="font-body bg-gray-50">
            <Slider />
            <Category />
            <Popular products={popular} onAdd={handleAdd} />
            <Latest products={latest} onAdd={handleAdd} />
            {/* not yet implemented */}
            {/* <Featured products={featured} onAdd={handleAdd} /> */}
        </div>
    );
}
