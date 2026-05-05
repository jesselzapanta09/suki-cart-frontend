import React from "react";

const sections = [
    {
        title: "Information We Collect",
        body: "We collect the details needed to run SukiCart smoothly, including account information, delivery details, order history, and messages related to your purchases.",
    },
    {
        title: "How We Use Information",
        body: "Your information is used to process orders, coordinate deliveries, improve store listings, provide support, and keep the marketplace safe for customers and sellers.",
    },
    {
        title: "Sharing and Protection",
        body: "We only share the information required to complete your transaction or comply with legal obligations, and we apply reasonable safeguards to protect your account and order data.",
    },
];

export default function PrivacyPolicyPage() {
    return (
        <section className="bg-gray-50 px-6 py-12 sm:py-16">
            <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                    Privacy Policy
                </span>
                <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                    How SukiCart handles your information
                </h1>
                <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                    This page outlines the general ways we collect, use, and protect information across the
                    SukiCart marketplace experience.
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
