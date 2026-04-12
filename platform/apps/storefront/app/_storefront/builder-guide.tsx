type BuilderGuideProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
  body: string;
  detail: string;
};

export function BuilderGuide({
  currentStep,
  totalSteps,
  title,
  body,
  detail
}: BuilderGuideProps) {
  return (
    <div className="builder-guide">
      <div>
        <p className="section-kicker">{`Step ${currentStep} of ${totalSteps}`}</p>
        <h2>{title}</h2>
      </div>
      <p>{body}</p>
      <span className="builder-guide-detail">{detail}</span>
    </div>
  );
}
