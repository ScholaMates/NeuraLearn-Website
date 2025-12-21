export default function VideoSection() {
    return (
        <section className="py-24">
            <div className="container mx-auto px-4 text-center">
                <h2 className="mb-12 text-3xl font-bold text-mocha-text sm:text-4xl">
                    See it in Action
                </h2>
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-mocha-surface2 shadow-2xl shadow-mocha-mauve/20">
                    <div className="aspect-video w-full bg-mocha-crust">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=ScZ_5s0i7f0_8q9_"
                            title="NeuraLearn Demo"
                            style={{ border: 0 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
}
