import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_PLAY_DELAY = 5000;

const HERO_SLIDES = [
    {
        tag: "TRUSTED EVERYDAY ESSENTIALS",
        title: "SukiCart Picks",
        accent: "Made Easy",
        subtitle: "Your trusted online shop app for daily essentials, simple checkout, and smooth delivery.",
        bg: "from-green-950 via-green-900 to-green-700",
    },
    {
        tag: "SMART AND SIMPLE SHOPPING",
        title: "Daily Finds",
        accent: "Shop Better",
        subtitle: "Browse home, school, and office needs in one place without the usual shopping hassle.",
        bg: "from-emerald-950 via-emerald-900 to-teal-700",
    },
    {
        tag: "FAST AND EASY ORDERS",
        title: "Quick Checkout",
        accent: "No Delays",
        subtitle: "Order your essentials in minutes with a clean, fast, and reliable shopping experience.",
        bg: "from-green-900 via-green-800 to-lime-700",
    },
    {
        tag: "RELIABLE DOORSTEP DELIVERY",
        title: "Fast Delivery",
        accent: "Right Away",
        subtitle: "Get your items delivered straight to your door quickly, safely, and without delays.",
        bg: "from-lime-900 via-green-800 to-emerald-600",
    },
    {
        tag: "BETTER VALUE EVERY DAY",
        title: "Save More",
        accent: "Every Time",
        subtitle: "Enjoy fair prices on quality essentials and make everyday shopping more convenient.",
        bg: "from-teal-950 via-green-900 to-lime-600",
    },
];

function HeroBackground({ backgroundClass }) {
    return (
        <div className={`absolute inset-0 bg-linear-to-br ${backgroundClass} transition-all duration-700`}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 right-[-8%] h-80 w-80 rounded-full border border-white/10 bg-white/10 blur-2xl" />
                <div className="absolute bottom-[-18%] left-[-10%] h-72 w-72 rounded-full border border-white/10 bg-lime-300/10 blur-2xl" />
                <svg className="absolute inset-0 opacity-[0.05]" width="100%" height="100%" aria-hidden="true">
                    <defs>
                        <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>
            </div>
        </div>
    );
}

function SlideIndicators({ slides, activeIndex, onSelect }) {
    return (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
                <button
                    key={slide.tag}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-pressed={index === activeIndex}
                    onClick={() => onSelect(index)}
                    className={`cursor-pointer rounded-full border-none transition-all ${
                        index === activeIndex ? "h-2 w-8 bg-white" : "h-2 w-2 bg-white/40 hover:bg-white/60"
                    }`}
                />
            ))}
        </div>
    );
}

function SlideNavigation({ onPrevious, onNext }) {
    const buttonClassName =
        "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition-colors hover:bg-white/30 md:flex";

    return (
        <>
            <button type="button" aria-label="Previous slide" onClick={onPrevious} className={`${buttonClassName} left-6`}>
                <ChevronLeft size={20} />
            </button>
            <button type="button" aria-label="Next slide" onClick={onNext} className={`${buttonClassName} right-6`}>
                <ChevronRight size={20} />
            </button>
        </>
    );
}

function SlideContent({ slide }) {
    return (
        <div className="flex w-full items-center justify-center">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-300 animate-pulse" />
                    <span className="font-mono text-xs font-medium tracking-[0.25em] text-emerald-100">{slide.tag}</span>
                </div>

                <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                    {slide.title}
                    <br />
                    <span className="text-emerald-300">{slide.accent}</span>
                </h1>

                <p className="mx-auto max-w-2xl text-sm leading-6 text-green-100 sm:text-base sm:leading-7">
                    {slide.subtitle}
                </p>
            </div>
        </div>
    );
}

export default function Slider() {
    const [activeIndex, setActiveIndex] = useState(0);

    const goToNext = useCallback(() => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % HERO_SLIDES.length);
    }, []);

    const goToPrevious = useCallback(() => {
        setActiveIndex((currentIndex) => (currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }, []);

    const goToSlide = useCallback((index) => {
        setActiveIndex(index);
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(goToNext, AUTO_PLAY_DELAY);
        return () => window.clearInterval(intervalId);
    }, [goToNext, activeIndex]);

    const activeSlide = HERO_SLIDES[activeIndex];

    return (
        <section className="relative isolate flex h-[50dvh] items-center overflow-hidden">
            <HeroBackground backgroundClass={activeSlide.bg} />

            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-14 sm:px-10 lg:py-16">
                <SlideContent slide={activeSlide} />
            </div>

            <SlideNavigation onPrevious={goToPrevious} onNext={goToNext} />
            <SlideIndicators slides={HERO_SLIDES} activeIndex={activeIndex} onSelect={goToSlide} />

            <div className="absolute -bottom-px left-0 w-full overflow-hidden leading-none">
                <svg
                    viewBox="0 0 1440 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    className="block h-15.5 w-full"
                >
                    <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="#ffffff" />
                </svg>
            </div>
        </section>
    );
}
