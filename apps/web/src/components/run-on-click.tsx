export function RunOnClick({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  // biome-ignore lint/a11y/noStaticElementInteractions: onClick needs to be on a div in this case; so rules should be suppressed
  // biome-ignore lint/a11y/useKeyWithClickEvents: same as above
  // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same as above
  return <div onClick={onClick}>{children}</div>;
}
