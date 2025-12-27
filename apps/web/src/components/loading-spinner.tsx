export function LoadingSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="currentColor"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Loading</title>
      <g className="spinner_OSmW">
        <rect height="5" opacity=".14" width="2" x="11" y="1" />
        <rect
          height="5"
          opacity=".29"
          transform="rotate(30 12 12)"
          width="2"
          x="11"
          y="1"
        />
        <rect
          height="5"
          opacity=".43"
          transform="rotate(60 12 12)"
          width="2"
          x="11"
          y="1"
        />
        <rect
          height="5"
          opacity=".57"
          transform="rotate(90 12 12)"
          width="2"
          x="11"
          y="1"
        />
        <rect
          height="5"
          opacity=".71"
          transform="rotate(120 12 12)"
          width="2"
          x="11"
          y="1"
        />
        <rect
          height="5"
          opacity=".86"
          transform="rotate(150 12 12)"
          width="2"
          x="11"
          y="1"
        />
        <rect height="5" transform="rotate(180 12 12)" width="2" x="11" y="1" />
      </g>
    </svg>
  );
}
