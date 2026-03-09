import React from "react";

interface CosmoLogoProps {
  size?: number;
}

export function CosmoLogo({ size = 40 }: CosmoLogoProps) {
  return (
    <div
      className="cosmo-logo"
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="cosmo-orbit" />
      <div className="cosmo-core" />
    </div>
  );
}
