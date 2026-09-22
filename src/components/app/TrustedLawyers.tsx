import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { avatarUrlFor } from "@/data/avatarPool";

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
              ? "fill-warning text-warning"
              : star === Math.ceil(rating) && !Number.isInteger(rating)
                ? "fill-warning/40 text-warning"
                : "fill-transparent text-border"
          }`}
        />
      ))}
    </div>
  );
}

function LawyerCard({ lawyer }: { lawyer: (typeof LAWYERS)[number] }) {
  return (
    <div className="flex w-56 shrink-0 flex-col items-center gap-2.5 px-4 text-center">
      <img
        src={avatarUrlFor(lawyer.name, 160)}
        alt={lawyer.name}
        className="h-16 w-16 shrink-0 rounded-full border border-border object-cover shadow-2xs"
        loading="eager"
        draggable={false}
      />
      <div>
        <h4 className="text-sm font-bold text-foreground">{lawyer.name}</h4>
        <p className="mt-0.5 text-xs font-medium text-primary">{lawyer.practice}</p>
        <p className="mt-1 text-xs text-muted-foreground">{lawyer.city}</p>
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <StarRating rating={lawyer.rating} />
          <span className="text-[11px] font-bold text-warning">{lawyer.rating}</span>
          <span className="text-[10px] text-muted-foreground">({lawyer.reviews})</span>
        </div>
      </div>
    </div>
  );
}

export function TrustedLawyers() {
  const track = [...LAWYERS, ...LAWYERS];

  return (
    <section className="border-t border-border py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Our network
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Trusted Lawyers
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified Lawyers from Hyderabad &amp; Visakhapatnam, ready to represent your case.
          </p>
        </div>

        <div className="relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee divide-x divide-border">
            {track.map((lawyer, i) => (
              <Link key={`${lawyer.name}-${i}`} to="/citizen-login">
                <LawyerCard lawyer={lawyer} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
