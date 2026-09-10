import Image from "next/image";

const navLinks = ["Home", "Offers", "Collections", "Contact"];

export default function SiteHeader() {
  return (
    <header className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-6 px-8 py-6 md:px-12 md:py-8 lg:px-16">
      <Image
        src={encodeURI("/logo/image 1.png")}
        alt="Nike"
        width={72}
        height={28}
        priority
        className="h-7 w-auto self-center mix-blend-lighten"
      />

      <nav className="hidden items-center justify-end gap-10 pr-6 text-[15px] text-white/85 md:flex xl:pr-10">
        {navLinks.map((link, index) => (
          <a
            key={link}
            href="#"
            className={
              index === 0
                ? "font-semibold text-white"
                : "transition-colors hover:text-white"
            }
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4 justify-self-end">
        <label className="hidden h-11 items-center gap-2 rounded-full bg-nike-surface px-5 sm:flex">
          <Image
            src={encodeURI("/icon/search (2).png")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 mix-blend-lighten"
          />
          <input
            type="search"
            placeholder="Search"
            className="w-24 bg-transparent text-sm font-semibold text-white placeholder:text-white/65 focus:outline-none lg:w-36"
          />
        </label>

        <button type="button" aria-label="Giỏ hàng" className="cursor-pointer">
          <Image
            src={encodeURI("/icon/bag (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] mix-blend-lighten transition-transform hover:scale-110"
          />
        </button>

        <button type="button" aria-label="Menu" className="cursor-pointer">
          <Image
            src={encodeURI("/icon/menu (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] mix-blend-lighten transition-transform hover:scale-110"
          />
        </button>
      </div>
    </header>
  );
}
