import React from "react";

const sections = [
    {
        title: "Marketplace Use",
        body: "By using SukiCart, you agree to provide accurate account information, follow platform rules, and avoid any activity that disrupts sellers, customers, or order fulfillment.",
    },
    {
        title: "Orders and Fulfillment",
        body: "Product availability, pricing, and delivery timing may vary by seller. Orders are subject to confirmation, and sellers are responsible for keeping their listings updated.",
    },
    {
        title: "Accounts and Responsibilities",
        body: "Users are responsible for maintaining account security and for activity performed under their account. SukiCart may limit access when misuse, fraud, or policy violations are detected.",
    },
];

export default function TermsOfServicePage() {
    return (
        <section className="bg-gray-50 px-6 py-12 sm:py-16">
            <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                    Terms of Service
                </span>
                <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                    The basic rules for using SukiCart
                </h1>
                <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                    These terms summarize expected use of the platform for browsing, buying, selling, and managing
                    marketplace activity.
                </p>

                <div className="mt-10 space-y-8">
                    {sections.map((section) => (
                        <article key={section.title}>
                            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                            <p className="mt-2 text-sm leading-7 text-gray-600 sm:text-base">{section.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
