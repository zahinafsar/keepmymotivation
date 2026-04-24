import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type MotivationEmailProps = {
  greeting: string;
  body: string;
  quote: string;
  quoteAuthor: string;
  image?: { url: string; alt: string; credit: { name: string; link: string } } | null;
  upgradeUrl?: string;
  showUpgrade?: boolean;
  manageUrl: string;
};

export default function MotivationEmail({
  greeting,
  body: bodyText,
  image,
  upgradeUrl,
  showUpgrade,
  manageUrl,
}: MotivationEmailProps) {
  const paragraphs = bodyText.split(/\n+/).filter(Boolean);
  const previewText = paragraphs[0] ?? greeting;
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          {image && (
            <Section>
              <Img
                src={image.url}
                alt={image.alt}
                width={560}
                height={320}
                style={heroImg}
              />
            </Section>
          )}
          <Section style={{ padding: "28px 32px 20px" }}>
            <Text style={greetingStyle}>{greeting}</Text>
            {paragraphs.map((p, i) => (
              <Text key={i} style={para}>
                {p}
              </Text>
            ))}
          </Section>
          {showUpgrade && upgradeUrl && (
            <Section style={{ padding: "0 32px 24px" }}>
              <Text style={upgradeHint}>
                Prefer a different cadence?{" "}
                <Link href={upgradeUrl} style={upgradeLink}>
                  Adjust your schedule
                </Link>
                .
              </Text>
            </Section>
          )}
          {image && (
            <Text style={credit}>
              Photo by{" "}
              <Link href={image.credit.link} style={creditLink}>
                {image.credit.name}
              </Link>{" "}
              on Pexels
            </Text>
          )}
          <Section style={footer}>
            <Text style={footerText}>
              You receive this because you set a goal at KeepMyMotivation.
              <br />
              <Link href={manageUrl} style={footerLink}>
                Manage your goals
              </Link>{" "}
              to pause or stop these emails.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#0b0b0f",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: "40px 0",
};
const container: React.CSSProperties = {
  backgroundColor: "#15151c",
  borderRadius: 14,
  overflow: "hidden",
  maxWidth: 600,
  margin: "0 auto",
  border: "1px solid #26262f",
};
const heroImg: React.CSSProperties = {
  width: "100%",
  height: "auto",
  display: "block",
  objectFit: "cover",
};
const greetingStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 20,
  fontWeight: 600,
  margin: "0 0 16px",
};
const para: React.CSSProperties = {
  color: "#d4d4d8",
  fontSize: 15,
  lineHeight: 1.65,
  margin: "0 0 14px",
};
const upgradeHint: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 13,
  margin: "0 0 12px",
};
const upgradeLink: React.CSSProperties = {
  color: "#d4d4d8",
  textDecoration: "underline",
};
const credit: React.CSSProperties = {
  color: "#5c5c66",
  fontSize: 11,
  textAlign: "center",
  padding: "0 16px 16px",
  margin: 0,
};
const creditLink: React.CSSProperties = { color: "#9999a3" };
const footer: React.CSSProperties = {
  borderTop: "1px solid #26262f",
  padding: "16px 32px 20px",
};
const footerText: React.CSSProperties = {
  color: "#6b6b75",
  fontSize: 11,
  lineHeight: 1.6,
  textAlign: "center",
  margin: 0,
};
const footerLink: React.CSSProperties = {
  color: "#9999a3",
  textDecoration: "underline",
};
