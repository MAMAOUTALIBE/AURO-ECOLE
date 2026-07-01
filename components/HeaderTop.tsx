import Image from "next/image";
import Link from "next/link";
import { socialChannels } from "@/components/SocialIcons";

const formationTickerItems = [
  {
    label: "PERMIS B",
    href: "/formations",
    image: "/formations/photos/permis-b-auto-declic.webp"
  },
  {
    label: "VTC",
    href: "/vtc",
    image: "/formations/photos/vtc-excellence.webp"
  },
  {
    label: "SST",
    href: "/sst",
    image: "/formations/photos/sst-initial.webp"
  },
  {
    label: "CACES",
    href: "/logistique-securite",
    image: "/formations/photos/chariots-elevateurs-r489.webp"
  },
  {
    label: "TRACTEUR",
    href: "/logistique-securite",
    image: "/formations/photos/terberg-tracteur-parc.webp"
  },
  {
    label: "NACELLE",
    href: "/logistique-securite",
    image: "/formations/photos/nacelles-pemp-r486.webp"
  },
  {
    label: "CPF",
    href: "/financement",
    image: "/formations/photos/stage-accelere.webp"
  }
];

function OfferQrTickerItem({ hidden }: { hidden?: boolean }) {
  const content = (
    <>
      <span className="grid place-items-center leading-none">
        <span className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-loden-700">QR</span>
        <span className="text-lg font-black text-loden-900">-50€</span>
      </span>
      <Image
        src="/offre-50/qr_offre_50_LDNE50.png"
        alt=""
        width={56}
        height={56}
        className="h-12 w-12 rounded-lg bg-white object-contain"
      />
    </>
  );

  const className =
    "focus-ring inline-flex h-16 items-center gap-2 rounded-2xl border border-white/70 bg-white px-3 text-loden-900 shadow-[0_12px_28px_rgba(5,50,74,0.18)] lg:h-20";

  if (hidden) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href="/offre-50?code=LODENE50" className={className} aria-label="Voir l'offre LODENE -50 euros avec le QR code">
      {content}
    </Link>
  );
}

function FormationTickerItem({ item, hidden }: { item: (typeof formationTickerItems)[number]; hidden?: boolean }) {
  const content = (
    <>
      <Image
        src={item.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 190px, 148px"
        className="object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-loden-900/90 via-loden-900/55 to-transparent px-3 pb-2 pt-5">
        <span className="block whitespace-nowrap text-center text-sm font-black uppercase tracking-[0.08em] text-white drop-shadow lg:text-base">
          {item.label}
        </span>
      </span>
    </>
  );

  const className =
    "focus-ring relative block h-16 w-36 overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-white shadow-[0_14px_34px_rgba(5,50,74,0.22)] transition hover:border-white/40 lg:h-20 lg:w-48";

  if (hidden) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href={item.href} className={className} aria-label={item.label}>
      {content}
    </Link>
  );
}

function TickerGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3 pr-3 lg:gap-4 lg:pr-4" aria-hidden={hidden}>
      {formationTickerItems.slice(0, 3).map((item) => (
        <FormationTickerItem key={item.label} item={item} hidden={hidden} />
      ))}
      <OfferQrTickerItem hidden={hidden} />
      {formationTickerItems.slice(3).map((item) => (
        <FormationTickerItem key={item.label} item={item} hidden={hidden} />
      ))}
    </div>
  );
}

export function HeaderTop() {
  return (
    <div className="border-b border-loden-300/30 bg-loden-900 text-xs text-white shadow-[0_10px_28px_rgba(5,50,74,0.22)] lg:text-sm">
      <div className="container-pad flex h-20 items-center gap-3 lg:h-24 lg:gap-6">
        <div className="marquee min-w-0 flex-1" role="marquee" aria-label="Informations LODENE">
          <div className="marquee-track">
            <TickerGroup />
            <TickerGroup hidden />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 lg:flex" aria-label="Réseaux sociaux" hidden={socialChannels.length === 0}>
          {socialChannels.map(({ label, href, Icon }) => (
            <a
              key={label}
              className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white shadow-sm ring-1 ring-white/15 transition hover:scale-110 hover:bg-white/15 hover:shadow-md"
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
