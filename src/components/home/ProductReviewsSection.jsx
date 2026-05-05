import React from "react";
import { Button, Pagination, Spin } from "antd";
import { Star } from "lucide-react";

export default function ProductReviewsSection({
    reviewSummary,
    reviews,
    loading = false,
    selectedRating = "all",
    currentPage = 1,
    totalReviews = 0,
    pageSize = 5,
    onFilterChange,
    onPageChange,
}) {

    const averageRating = Number(reviewSummary?.average_rating || 0);
    const reviewCount = Number(reviewSummary?.review_count || 0);
    const distribution = reviewSummary?.distribution || [];

    const renderStars = (rating, size = 18) => {
        const roundedRating = Math.round(Number(rating || 0));

        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={size}
                className={i < roundedRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
            />
        ));
    };

    const formatReviewerName = (review) => {
        const firstname = review?.user?.firstname || "";
        const lastname = review?.user?.lastname || "";
        const fullName = `${firstname} ${lastname}`.trim();

        return fullName || "Verified Customer";
    };

    return (
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm sm:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>

                <div className="mb-8 grid grid-cols-1 gap-6 border-b border-gray-200 pb-8 md:grid-cols-3 md:gap-8">
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-gray-800 mb-2">{averageRating.toFixed(1)}</div>
                        <div className="flex gap-1 mb-2">
                            {renderStars(averageRating, 24)}
                        </div>
                        <p className="text-sm text-gray-600">Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        {distribution.map((rating) => (
                            <div key={rating.stars} className="flex items-center gap-4">
                                <div className="flex items-center gap-1 w-16">
                                    {[...Array(rating.stars)].map((_, i) => (
                                        <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                                    ))}
                                    <span className="text-xs text-gray-600">{rating.stars}</span>
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-green-600 h-full rounded-full transition-all"
                                        style={{ width: `${rating.percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">{rating.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="-mx-1 overflow-x-auto px-1 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
                    <div className="flex w-max gap-2">
                        <Button
                            type={selectedRating === "all" ? "primary" : "default"}
                            disabled={loading}
                            onClick={() => onFilterChange?.("all")}
                        >
                            All
                        </Button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <Button
                                key={rating}
                                type={selectedRating === rating ? "primary" : "default"}
                                disabled={loading}
                                onClick={() => onFilterChange?.(rating)}
                            >
                                {rating} Star
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <Spin spinning={loading}>
                {reviews.length > 0 ? (
                    <>
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="pb-6 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h4 className="font-semibold text-gray-800">{formatReviewerName(review)}</h4>
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                    Verified
                                                </span>
                                                {review.variant_name && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                        {review.variant_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-0.5">
                                                    {renderStars(review.rating, 14)}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm leading-relaxed">{review.review}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={totalReviews}
                                onChange={onPageChange}
                                showSizeChanger={false}
                                disabled={loading}
                            />
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                        <p className="text-base font-semibold text-gray-700">No reviews found</p>
                        <p className="mt-2 text-sm text-gray-500">
                            {selectedRating === "all"
                                ? "Be the first customer to review this product after delivery."
                                : `There are no ${selectedRating}-star reviews for this product yet.`}
                        </p>
                    </div>
                )}
            </Spin>
        </div>
    );
}
