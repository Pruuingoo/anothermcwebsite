import { siteConfig } from "@/lib/site-config";

export default function IPGrid() {
  return (
    <div className="ipgrid" data-reveal>
      <button
        className="ip"
        type="button"
        data-copy={siteConfig.javaAddress}
      >
        <span>
          <span className="ip__label">Java Edition</span>
          <span className="ip__value">{siteConfig.javaAddress}</span>
        </span>
        <span className="ip__btn">
          <svg width="14" height="14" aria-hidden="true"><use href="#i-copy" /></svg>
          <span data-copy-label>Copy</span>
        </span>
      </button>
      <button
        className="ip"
        type="button"
        data-copy={siteConfig.bedrockAddress}
        data-port={siteConfig.bedrockPort}
      >
        <span>
          <span className="ip__label">Bedrock Edition</span>
          <span className="ip__value">{siteConfig.bedrockAddress} &#183; {siteConfig.bedrockPort}</span>
        </span>
        <span className="ip__btn">
          <svg width="14" height="14" aria-hidden="true"><use href="#i-copy" /></svg>
          <span data-copy-label>Copy</span>
        </span>
      </button>
    </div>
  );
}
