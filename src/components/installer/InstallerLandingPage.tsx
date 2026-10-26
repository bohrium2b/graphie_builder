import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { ArrowRight, CheckCircle, Download, Monitor, Package, Play, Settings } from "lucide-react";

const ROOT_ID = "__graphie-installer-root__";

const Background = styled("div")`
  position: fixed;
  inset: 0;
  background: #0f1115;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(8, 61, 104, 0.25) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0, 74, 152, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(97, 215, 198, 0.1) 0%, transparent 35%);
  overflow: hidden;
`;

const Glow = styled("div")<{ $x: number; $y: number }>`
  position: fixed;
  top: ${(p) => p.$y}px;
  left: ${(p) => p.$x}px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(168, 199, 250, 0.18), transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  z-index: 0;
  animation: float 8s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(30px, -40px); }
    66% { transform: translate(-20px, 30px); }
  }
`;

const Container = styled("div")`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  overflow-y: auto;
`;

const Card = styled("div")`
  width: 100%;
  max-width: 720px;
  background: rgba(18, 19, 22, 0.7);
  border: 1px solid rgba(141, 145, 153, 0.2);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
`;

const Header = styled("div")`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
`;

const LogoIcon = styled("div")`
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #a8c7fa 0%, #7fcfff 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 24px rgba(168, 199, 250, 0.35);
  animation: pulseGlow 4s ease-in-out infinite;

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 24px rgba(168, 199, 250, 0.35); transform: scale(1); }
    50% { box-shadow: 0 0 40px rgba(168, 199, 250, 0.6); transform: scale(1.05); }
  }
`;

const LogoMark = styled("svg")`
  width: 30px;
  height: 30px;
  fill: #063168;
`;

const Brand = styled("div")`
  display: flex;
  flex-direction: column;
`;

const BrandName = styled("span")`
  font-family: var(--font-sans);
  font-size: 24px;
  font-weight: 700;
  color: #e2e2e6;
  letter-spacing: -0.5px;
`;

const BrandTag = styled("span")`
  font-size: 12px;
  color: #7fcfff;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 2px;
`;

const SectionTitle = styled("h2")`
  font-size: 28px;
  font-weight: 600;
  color: #e2e2e6;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const SectionSubtitle = styled("p")`
  font-size: 15px;
  color: #c3c6cf;
  margin: 0 0 32px 0;
  line-height: 1.6;
`;

const Carousel = styled("div")`
  position: relative;
  width: 100%;
  min-height: 260px;
  margin-bottom: 32px;
`;

const CarouselTrack = styled("div")<{ $active: number }>`
  display: flex;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(${(p) => -p.$active * 100}%);
  width: 300%;
`;

const Slide = styled("div")<{ $active: boolean }>`
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
  opacity: ${(p) => (p.$active ? 1 : 0)};
  transform: ${(p) => (p.$active ? "translateX(0)" : "translateX(20px)")};
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${(p) => (p.$active ? "auto" : "none")};
`;

const StepIcon = styled("div")<{ $step: number; $active: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${(p) => (p.$active ? "linear-gradient(135deg, #a8c7fa, #7fcfff)" : "rgba(67, 71, 78, 0.6)")};
  border: ${(p) => (p.$active ? "2px solid #a8c7fa" : "1px solid rgba(141, 145, 153, 0.2)")};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${(p) => (p.$active ? "0 0 28px rgba(168, 199, 250, 0.45)" : "none")};
  animation: ${(p) => (p.$active ? "stepPop 0.6s ease-out" : "none")};

  @keyframes stepPop {
    0% { transform: scale(0.8); }
    100% { transform: scale(1); }
  }
`;

const StepIconSvg = styled("svg")`
  width: 30px;
  height: 30px;
  fill: ${(p: { $active: boolean }) => (p.$active ? "#063168" : "#c3c6cf")};
`;

const StepNumber = styled("span")<{ $active: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => (p.$active ? "#e2e2e6" : "#747880")};
`;

const StepTitle = styled("h3")`
  font-size: 18px;
  font-weight: 600;
  color: #e2e2e6;
  margin: 8px 0 4px 0;
`;

const StepDesc = styled("p")`
  font-size: 13px;
  color: #a1a5ad;
  text-align: center;
  line-height: 1.5;
  max-width: 320px;
`;

const ProgressWrapper = styled("div")`
  width: 100%;
  height: 6px;
  background: rgba(67, 71, 78, 0.4);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressBar = styled("div")<{ $width: number }>`
  height: 100%;
  width: ${(p) => p.$width}%;
  background: linear-gradient(90deg, #a8c7fa, #61d7c6);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    100% { transform: translateX(200%); }
  }
`;

const ProgressLabel = styled("div")`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #a1a5ad;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ActionRow = styled("div")`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled("button")<{ $primary?: boolean; $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  background: ${(p) => (p.$primary ? "linear-gradient(135deg, #a8c7fa, #7fcfff)" : "rgba(67, 71, 78, 0.5)")};
  color: ${(p) => (p.$primary ? "#063168" : "#e2e2e6")};

  &:hover:not(:disabled) {
    ${(p) => p.$primary && "filter: brightness(1.1); transform: translateY(-1px);"}
    background: ${(p) => !p.$primary && "rgba(95, 100, 109, 0.6)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Dots = styled("div")`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
`;

const Dot = styled("div")<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$active ? "#a8c7fa" : "rgba(168, 199, 250, 0.3)")};
  transition: all 0.3s ease;
`;

interface InstallerLandingPageProps {
  onComplete?: () => void;
  initialStep?: number;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
}

const STEPS = [
  {
    id: "welcome",
    icon: <Monitor />,
    title: "Welcome to Graphie Builder",
    desc: "Professional mathematical and scientific diagramming for teachers and students.",
  },
  {
    id: "preparing",
    icon: <Package />,
    title: "Preparing installation",
    desc: "Checking system requirements and preparing files.",
  },
  {
    id: "installing",
    icon: <Download />,
    title: "Installing components",
    desc: "Copying files and registering the application.",
  },
  {
    id: "configuring",
    icon: <Settings />,
    title: "Configuring settings",
    desc: "Setting up shortcuts, file associations, and preferences.",
  },
  {
    id: "complete",
    icon: <CheckCircle />,
    title: "Installation complete",
    desc: "Graphie Builder is ready to use. Launch it to start creating diagrams.",
  },
] as const;

export function InstallerLandingPage({
  onComplete,
  initialStep = 0,
  autoAdvance = true,
  autoAdvanceInterval = 4000,
}: InstallerLandingPageProps = {}) {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [isInstalling, setIsInstalling] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const nextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const startInstall = useCallback(() => {
    setIsInstalling(true);
    progressRef.current = 0;
    const timer = setInterval(() => {
      progressRef.current += Math.random() * 12 + 3;
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        clearInterval(timer);
        setIsInstalling(false);
        setTimeout(() => {
          setActiveStep(STEPS.length - 1);
          onComplete?.();
        }, 800);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (autoAdvance && activeStep < STEPS.length - 1 && !isInstalling) {
      intervalRef.current = window.setTimeout(() => {
        if (activeStep === STEPS.length - 2) {
          startInstall();
        } else {
          nextStep();
        }
      }, autoAdvanceInterval);
    }
    return () => {
      if (intervalRef.current) window.clearTimeout(intervalRef.current);
    };
  }, [activeStep, autoAdvance, autoAdvanceInterval, isInstalling, nextStep, startInstall]);

  const step = STEPS[activeStep];
  const isLast = activeStep === STEPS.length - 1;
  const progress = isLast ? 100 : Math.round(((activeStep + 0.5) / STEPS.length) * 100);

  return (
    <Background>
      <Glow $x={-80} $y={-60} />
      <Glow $x={-60} $y={620} />
      <Container>
        <Card>
          <Header>
            <LogoIcon>
              <LogoMark viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l0.71 0.71L12 18l6.79 3 -1.42 -6.36z" />
                <path d="M12 12.5L12 15M12 8.5L12 11M12 4.5L12 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </LogoMark>
            </LogoIcon>
            <Brand>
              <BrandName>Graphie Builder</BrandName>
              <BrandTag>Installer</BrandTag>
            </Brand>
          </Header>

          <SectionTitle>{step.title}</SectionTitle>
          <SectionSubtitle>{step.desc}</SectionSubtitle>

          <Carousel>
            <CarouselTrack $active={activeStep}>
              {STEPS.map((s, i) => (
                <Slide key={s.id} $active={i === activeStep}>
                  <StepIcon $step={i} $active={i === activeStep}>
                    <StepIconSvg $active={i === activeStep}>
                      {React.cloneElement(s.icon, { size: 30, strokeWidth: i === activeStep ? 2.5 : 1.5 })}
                    </StepIconSvg>
                  </StepIcon>
                  <StepNumber $active={i === activeStep}>{`${i + 1} / ${STEPS.length}`}</StepNumber>
                  <StepTitle>{s.title}</StepTitle>
                  <StepDesc>{s.desc}</StepDesc>
                </Slide>
              ))}
            </CarouselTrack>
          </Carousel>

          {!isLast && (
            <>
              <ProgressWrapper>
                <ProgressBar $width={progress} />
              </ProgressWrapper>
              <ProgressLabel>
                <span>{progress}%</span>
                <span>{STEPS[activeStep].id}</span>
              </ProgressLabel>
            </>
          )}

          {isInstalling && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid #a8c7fa", borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{ fontSize: 13, color: "#a1a5ad" }}>Installing files…</span>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
            </div>
          )}

          <ActionRow>
            {!isInstalling && !isLast && (
              <Button $primary onClick={() => {
                if (activeStep === STEPS.length - 2) startInstall();
                else nextStep();
              }}>
                {activeStep === STEPS.length - 2 ? <Play size={18} /> : <ArrowRight size={18} />}
                {activeStep === STEPS.length - 2 ? "Install" : "Next"}
              </Button>
            )}
            {isLast && (
              <Button $primary onClick={onComplete}>
                <Play size={18} /> Launch Graphie Builder
              </Button>
            )}
            {!isLast && !isInstalling && (
              <Button onClick={() => window.electronAPI?.quit?.()}>
                Cancel
              </Button>
            )}
          </ActionRow>

          <Dots>
            {STEPS.map((_, i) => (
              <Dot key={i} $active={i === activeStep} />
            ))}
          </Dots>
        </Card>
      </Container>
    </Background>
  );
}

export function mountInstallerLandingPage(container?: HTMLElement | string) {
  const el =
    typeof container === "string" ? document.getElementById(container) : container ?? document.getElementById(ROOT_ID);

  if (!el) {
    const rootEl = document.createElement("div");
    rootEl.id = ROOT_ID;
    rootEl.style.position = "fixed";
    rootEl.style.inset = "0";
    rootEl.style.zIndex = "2147483647";
    document.body.appendChild(rootEl);
    return rootEl;
  }
  return el;
}

export default InstallerLandingPage;
