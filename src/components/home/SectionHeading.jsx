export default function SectionHeading({ tag, title, subtitle }) {
    return (
        <div className="text-center mb-10">
            {tag && <div className="inline-block px-4 py-1 rounded-full mb-3 bg-green-100 text-green-700 text-xs font-mono font-semibold tracking-wider uppercase">{tag}</div>}
            <h2 className="font-bold text-3xl md:text-4xl text-green-900 mb-3">{title}</h2>
            {subtitle && <p className="text-gray-500 text-base max-w-xl mx-auto">{subtitle}</p>}
        </div>
    );
}
