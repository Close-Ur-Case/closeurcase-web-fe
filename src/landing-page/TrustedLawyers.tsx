import { Star, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { avatarUrlFor } from "@/data/avatarPool";
import { Card } from "@/components/m3";
import { SectionKicker } from "@/landing-page/SectionKicker";

const LAWYERS = [
  {
    name: "Adv. Swathi Reddy",
    city: "Banjara Hills, Hyderabad",
    practice: "Criminal Law",
    rating: 4.9,
    reviews: 124,
  },
  {
    name: "Adv. Srinivas Chowdary",
    city: "Somajiguda, Hyderabad",
    practice: "Property Law",
    rating: 4.7,
    reviews: 89,
  },
  {
    name: "Adv. Sailaja Naidu",
    city: "MVP Colony, Visakhapatnam",
    practice: "Family Law",
    rating: 4.8,
    reviews: 211,
  },
  {
    name: "Adv. Venkatesh Rao",
    city: "Gachibowli, Hyderabad",
    practice: "Corporate Law",
    rating: 4.6,
    reviews: 67,
  },
  {
    name: "Adv. Haritha Sarma",
    city: "Dwaraka Nagar, Visakhapatnam",
    practice: "Cyber Law",
    rating: 4.9,
    reviews: 156,
  },
  {
    name: "Adv. Krishna Murthy",
    city: "Gajuwaka, Visakhapatnam",
    practice: "Labour Law",
    rating: 4.7,
    reviews: 93,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= Math.floor(rating)
              ? "fill-[#d4af37] text-[#d4af37]"
              : star === Math.ceil(rating) && !Number.isInteger(rating)
                ? "fill-[#d4af37]/40 text-[#d4af37]"
                : "fill-transparent text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function LawyerCard({ lawyer }: { lawyer: (typeof LAWYERS)[number] }) {
  return (
    <Card
      variant="outlined"
      className="flex !h-64 !w-56 shrink-0 flex-col !rounded-2xl !border-slate-200/80 !bg-white p-4 text-center shadow-sm shadow-slate-900/5 transition-all duration-300 hover:!border-[#d4af37]/40 hover:shadow-md hover:shadow-slate-900/8"
    >
      <img
        src={avatarUrlFor(lawyer.name, 160)}
        alt={lawyer.name}
        className="mx-auto h-16 w-16 shrink-0 rounded-full border border-[#d4af37]/25 object-cover shadow-2xs"
        loading="eager"
        draggable={false}
      />
      <h4 className="mt-2.5 line-clamp-1 text-sm font-bold text-slate-900">{lawyer.name}</h4>
      <p className="mt-0.5 line-clamp-1 font-serif text-xs font-semibold text-[#a9853f]">
        {lawyer.practice}
      </p>
      <p className="mt-1 flex min-h-8 items-start justify-center text-xs text-slate-500">
        {lawyer.city}
      </p>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <StarRating rating={lawyer.rating} />
        <span className="text-[11px] font-bold text-[#a9853f]">{lawyer.rating}</span>
        <span className="text-[10px] text-slate-400">({lawyer.reviews})</span>
      </div>
      <span className="mx-auto mt-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <ShieldCheck className="h-2.5 w-2.5" />
        Verified
      </span>
    </Card>
  );
}

export function TrustedLawyers() {
  const track = [...LAWYERS, ...LAWYERS];

  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-xl">
          <SectionKicker label="Our Advocate Network" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Trusted Advocates Ready to Serve
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Verified Advocates from Hyderabad and Visakhapatnam ready to take on your matter.
          </p>
        </div>

        <div className="relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-4">
            {track.map((lawyer, i) => (
              <Link key={`${lawyer.name}-${i}`} to="/citizen-login" className="block">
                <LawyerCard lawyer={lawyer} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
