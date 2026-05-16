import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ScheduledEmailProps = {
  preview: string;
  markdown: string;
  upgradeUrl?: string;
  showUpgrade?: boolean;
  manageUrl: string;
};

export default function ScheduledEmail({
  preview,
  markdown,
  upgradeUrl,
  showUpgrade,
  manageUrl,
}: ScheduledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview || ""}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section style={{ padding: "28px 32px 8px" }}>
            <Markdown
              markdownContainerStyles={mdContainer}
              markdownCustomStyles={mdStyles}
            >
              {markdown}
            </Markdown>
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
          <Section style={footer}>
            <Text style={footerText}>
              You receive this because you set up a schedule at KeepMyMotivation.
              <br />
              <Link href={manageUrl} style={footerLink}>
                Manage your schedules
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
const mdContainer: React.CSSProperties = {
  color: "#d4d4d8",
};
const mdStyles = {
  h1: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: "0 0 16px",
  },
  h2: {
    color: "#e4e4e7",
    fontSize: 18,
    fontWeight: 600,
    margin: "20px 0 10px",
  },
  h3: {
    color: "#e4e4e7",
    fontSize: 16,
    fontWeight: 600,
    margin: "18px 0 8px",
  },
  p: {
    color: "#d4d4d8",
    fontSize: 15,
    lineHeight: 1.65,
    margin: "0 0 12px",
  },
  ul: {
    margin: "0 0 14px",
    padding: "0 0 0 20px",
    color: "#d4d4d8",
  },
  ol: {
    margin: "0 0 14px",
    padding: "0 0 0 20px",
    color: "#d4d4d8",
  },
  li: {
    fontSize: 15,
    lineHeight: 1.6,
    margin: "0 0 6px",
  },
  link: {
    color: "#f97316",
    textDecoration: "underline",
  },
  bold: {
    color: "#ffffff",
    fontWeight: 700,
  },
  italic: {
    color: "#d4d4d8",
    fontStyle: "italic" as const,
  },
  codeInline: {
    backgroundColor: "#1f1f28",
    color: "#fbbf24",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 13.5,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  codeBlock: {
    backgroundColor: "#0f0f14",
    color: "#e4e4e7",
    padding: "14px 16px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.55,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    border: "1px solid #26262f",
    overflow: "auto" as const,
    margin: "0 0 14px",
  },
  blockQuote: {
    borderLeft: "3px solid #f97316",
    paddingLeft: 14,
    color: "#a1a1aa",
    fontStyle: "italic" as const,
    margin: "0 0 14px",
  },
  hr: {
    borderColor: "#26262f",
    margin: "20px 0",
  },
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
