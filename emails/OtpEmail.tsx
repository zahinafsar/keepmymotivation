import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export default function OtpEmail({ code, fullname }: { code: string; fullname: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your KeepMyMotivation verification code</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={p}>Hey {fullname.split(" ")[0]},</Text>
          <Text style={p}>Use this 6-digit code to confirm your email. It expires in 10 minutes.</Text>
          <Section style={codeBox}>
            <Text style={codeStyle}>{code}</Text>
          </Section>
          <Text style={small}>If you didn&apos;t request this, ignore this email.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#0b0b0f",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#e7e7ea",
  margin: 0,
  padding: "40px 0",
};
const container: React.CSSProperties = {
  backgroundColor: "#15151c",
  border: "1px solid #26262f",
  borderRadius: 12,
  maxWidth: 480,
  margin: "0 auto",
  padding: 32,
};
const h1: React.CSSProperties = { color: "#fff", fontSize: 22, margin: "0 0 16px" };
const p: React.CSSProperties = { color: "#c8c8ce", fontSize: 15, lineHeight: 1.55, margin: "0 0 12px" };
const codeBox: React.CSSProperties = {
  backgroundColor: "#0b0b0f",
  borderRadius: 8,
  padding: "20px 0",
  textAlign: "center",
  margin: "20px 0",
};
const codeStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 34,
  letterSpacing: 8,
  fontWeight: 700,
  margin: 0,
};
const small: React.CSSProperties = { color: "#6a6a75", fontSize: 12, margin: "20px 0 0" };
