import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Select, Input, Empty, App, Form } from "antd";
import { MapPin, ShoppingBag, ShoppingCart, Package } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/auth-context";
import * as orderService from "../../../services/orderService";
import addressService from "../../../services/addressService";
import { formatPeso } from "../../../utils/currency";
import { getStorageUrl } from "../../../utils/storage";

export default function CheckoutIndex() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { removeOrderedItems } = useCart();
    const { user } = useAuth();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addressExtra, setAddressExtra] = useState("");
    const [itemMessages, setItemMessages] = useState({});
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const [shippingData, setShippingData] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);

    // Get items from location state
    const items = useMemo(() => state?.items || [], [state?.items]);
    const totalItems = items.length;
    const checkedTotal = state?.total || 0;
    const shippingCost = shippingData?.total_shipping_fee || 0;
    const finalTotal = checkedTotal + shippingCost;

    const calculateShippingFees = useCallback(async () => {
        if (items.length === 0) return;

        setShippingLoading(true);
        try {
            const shippingPayload = {
                items: items.map(item => ({
                    cart_id: item.cartId || null,
                    product_id: item.id,
                    product_variant_id: item.variant_id || null,
                    quantity: item.qty,
                })),
            };

            const response = await orderService.calculateShipping(shippingPayload);
            
            if (response?.data) {
                setShippingData(response.data);
            }
        } catch (err) {
            console.error('Failed to calculate shipping:', err);
            message.error("Failed to calculate shipping fees");
        } finally {
            setShippingLoading(false);
        }
    }, [items, message]);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/customer/cart");
            return;
        }
        
        if (user?.locations) {
            setLocations(user.locations);
        }

        // Calculate shipping fees
        calculateShippingFees();
    }, [user, items, navigate, calculateShippingFees]);

    useEffect(() => {
        if (locations.length !== 1 || selectedLocation) {
            return;
        }

        const defaultLocationId = locations[0].id;
        setSelectedLocation(defaultLocationId);
        form.setFieldValue("delivery_location", defaultLocationId);
    }, [locations, selectedLocation, form]);

    useEffect(() => {
        let active = true;

        const loadLocationOptions = async () => {
            const resolvedLocations = await Promise.all(
                locations.map(async (loc) => {
                    const resolved = await addressService.resolveLocationParts(loc);
                    return {
                        value: loc.id,
                        label: addressService.formatLocation(resolved),
                    };
                })
            );

            if (active) {
                setLocationOptions(resolvedLocations);
            }
        };

        if (!locations.length) {
            setLocationOptions([]);
            return () => {
                active = false;
            };
        }

        loadLocationOptions();

        return () => {
            active = false;
        };
    }, [locations]);

    const getPrice = (item) => {
        const price = item.price ?? item.variant?.price ?? 0;
        return typeof price === 'number' ? price : Number(price || 0);
    };

    const getStock = (item) => Number(item.stock || item.variant?.stock || 0);

    const getVariantAttributes = (variant) => {
        if (!variant?.attributes || typeof variant.attributes !== "object") {
            return [];
        }

        return Object.entries(variant.attributes).filter(([, value]) => value !== null && value !== "");
    };

    const getItemKey = (item, index) => item.uuid || item.cartId || `${item.id}-${item.variant_id || "none"}-${index}`;

    const handlePlaceOrder = async () => {
        if (!selectedLocation) {
            message.warning("Please select a delivery location");
            return;
        }

        if (items.length === 0) {
            message.warning("No items to order");
            return;
        }

        const missingVariant = items.find(item => !item.variant_id);
        if (missingVariant) {
            message.warning(`Please select a variant for ${missingVariant.name}.`);
            return;
        }

        const overStockItem = items.find(item => item.qty > getStock(item));
        if (overStockItem) {
            const stock = getStock(overStockItem);
            message.warning(`Only ${stock} item${stock !== 1 ? "s" : ""} available for ${overStockItem.name}.`);
            return;
        }

        setCheckoutLoading(true);
        try {
            const orderData = {
                location_id: selectedLocation,
                address_extra: addressExtra || null,
                items: items.map((item, index) => ({
                    cart_id: item.cartId || null,
                    product_id: item.id,
                    product_variant_id: item.variant_id || null,
                    quantity: item.qty,
                    message: itemMessages[getItemKey(item, index)] || null,
                })),
            };

            const response = await orderService.createOrder(orderData);

            if (response?.data?.first_item_id) {
                message.success("Order placed successfully!");
                removeOrderedItems(items);
                
                // Redirect to the orders page after checkout
                setTimeout(() => {
                    navigate("/customer/orders");
                }, 500);
            }
        } catch (err) {
            message.error(err.message || "Failed to place order");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Empty description="No items in checkout" />
                    <Button 
                        type="primary" 
                        size="large" 
                        onClick={() => navigate("/customer/cart")}
                        className="mt-4"
                    >
                        Back to Cart
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
                {/* Header */}
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                            <ShoppingCart size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Complete Order</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                                {totalItems} item{totalItems !== 1 ? "s" : ""} ready for checkout
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                >
                <div className="space-y-5">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        {/* Delivery Information */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
                                    <p className="text-sm text-gray-400 mt-1">Select where you want your order delivered.</p>
                                </div>
                            </div>

                                <Form.Item
                                    name="delivery_location"
                                    label="Delivery Location"
                                    rules={[{ required: true, message: "Delivery location is required" }]}
                                    initialValue={selectedLocation}
                                >
                                    <Select
                                        placeholder="Select delivery location"
                                        onChange={(value) => {
                                            setSelectedLocation(value);
                                            form.setFieldValue('delivery_location', value);
                                        }}
                                        options={locationOptions}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="address_extra"
                                    label="Additional Address Info"
                                    initialValue={addressExtra}
                                >
                                    <Input
                                        placeholder="Street/Landmark/House number (optional)"
                                        onChange={(e) => {
                                            setAddressExtra(e.target.value);
                                            form.setFieldValue('address_extra', e.target.value);
                                        }}
                                        maxLength={500}
                                    />
                                </Form.Item>

                        </div>

                        {/* Order Items Review */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center shrink-0">
                                    <ShoppingCart size={20} className="text-purple-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                                    <p className="text-sm text-gray-400 mt-1">Review the items in your order.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {items.map((item, index) => {
                                    const attributes = getVariantAttributes(item.variant);
                                    const itemKey = getItemKey(item, index);

                                    return (
                                        <div key={itemKey} className="bg-gray-50 rounded-xl border border-gray-100 p-4 md:p-5">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-40 h-40 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                                    {item.images && item.images.length > 0 ? (
                                                        <img
                                                            src={getStorageUrl(item.images[0].full_url || item.images[0].image_path)}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                            <Package size={28} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Product</p>
                                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Category</p>
                                                        <p className="font-medium text-gray-700">{item.category || "Uncategorized"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Seller</p>
                                                        <p className="font-medium text-gray-700">{item.store?.store_name || "Unknown Seller"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Variant</p>
                                                        <p className="font-medium text-gray-700">{item.variant?.name || "No variant selected"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Quantity</p>
                                                        <p className="font-medium text-gray-700">{item.qty}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Unit Price</p>
                                                        <p className="font-medium text-gray-700">{formatPeso(getPrice(item))}</p>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Description</p>
                                                        <p className="font-medium text-gray-700">{item.description || "No description available"}</p>
                                                    </div>

                                                    {attributes.length > 0 && (
                                                        <div className="md:col-span-2">
                                                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Variant Attributes</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {attributes.map(([key, value]) => (
                                                                    <span key={`${key}-${value}`} className="px-2.5 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                                                                        {key}: {String(value)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="md:col-span-2">
                                                        <Form.Item
                                                            name={["item_messages", itemKey]}
                                                            label="Message for Seller (Optional)"
                                                            labelCol={{ span: 24 }}
                                                            wrapperCol={{ span: 24 }}
                                                            className="mb-0"
                                                            initialValue={itemMessages[itemKey] || ""}
                                                        >
                                                            <Input.TextArea
                                                                placeholder="Add a message or special instructions for this product"
                                                                onChange={(e) => {
                                                                    setItemMessages(prev => ({
                                                                        ...prev,
                                                                        [itemKey]: e.target.value,
                                                                    }));
                                                                }}
                                                                maxLength={1000}
                                                                rows={3}
                                                            />
                                                        </Form.Item>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Shipping Breakdown */}
                            {shippingData && (
                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 md:p-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-orange-100 flex items-center justify-center shrink-0">
                                            <Package size={20} className="text-orange-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Shipping Fees</h2>
                                            <p className="text-sm text-gray-400 mt-1">Breakdown per product order</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {shippingData.breakdown.map((item) => (
                                            <div key={`${item.product_id}-${item.product_variant_id || "none"}-${item.index}`} className="bg-white rounded-lg p-4 border border-orange-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{item.store_name} · Qty {item.quantity} · Total Weight: {item.total_weight}kg</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between text-gray-700">
                                                        <span>Base Fee:</span>
                                                        <span>{formatPeso(item.base_fee)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-700">
                                                        <span>Weight Fee ({item.total_weight}kg × {formatPeso(50)}):</span>
                                                        <span>{formatPeso(item.weight_fee)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold text-orange-600 border-t border-orange-200 pt-2 mt-2">
                                                        <span>Subtotal:</span>
                                                        <span>{formatPeso(item.shipping_fee)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                                    <p className="text-sm text-gray-400 mt-1">Choose how you want to pay for your order.</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-4">
                                <div className="shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                                        <ShoppingBag size={20} className="text-blue-600" />
                                    </div>
                                </div>
                                <div className="grow">
                                    <p className="font-semibold text-gray-900">Cash on Delivery (COD)</p>
                                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Total and Action */}
                    <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                <ShoppingBag size={20} className="text-green-700" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Total Amount</h2>
                                <p className="text-sm text-gray-400 mt-1">Complete your purchase.</p>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6 border border-green-200 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 font-medium">Subtotal (Products):</span>
                                <span className="text-lg font-semibold text-gray-900">{formatPeso(checkedTotal)}</span>
                            </div>
                            {shippingLoading ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Shipping:</span>
                                    <span className="text-sm text-gray-500">Calculating...</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Shipping:</span>
                                    <span className="text-lg font-semibold text-orange-600">{formatPeso(shippingCost)}</span>
                                </div>
                            )}
                            <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                                <span className="text-gray-700 font-bold">Total Amount:</span>
                                <span className="text-3xl font-bold text-green-600">{formatPeso(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                size="large"
                                className="flex-1"
                                onClick={() => navigate("/customer/cart")}
                            >
                                Back to Cart
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                className="flex-1"
                                loading={checkoutLoading}
                                disabled={!selectedLocation || shippingLoading}
                                onClick={handlePlaceOrder}
                                icon={<ShoppingBag size={16} />}
                            >
                                Place Order
                            </Button>
                        </div>
                    </div>
                </div>
                </Form>
            </div>
        
    );
}


