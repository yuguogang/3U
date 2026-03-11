import Link from "next/link";

export function PageTitle({
  title,
  detailLink,
}: {
  title: string;
  detailLink?: string;
}) {
  return (
    <div className="relative w-full h-6 mb-6">
      <Link href="/" className="absolute left-[35px] top-[5px]">
        <svg width="8" height="15" viewBox="0 0 8 15" fill="none">
          <path
            d="M7 1L1 7.5L7 14"
            stroke="white"
            strokeOpacity="0.8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <h1 className="text-xl font-semibold text-white text-center leading-6">
        {title}
      </h1>
      {detailLink && (
        <Link
          href={detailLink}
          className="absolute right-[32px] top-0 text-sm font-semibold text-white text-right leading-6"
        >
          明细
        </Link>
      )}
    </div>
  );
}
