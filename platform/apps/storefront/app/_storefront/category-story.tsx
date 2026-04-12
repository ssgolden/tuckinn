type CategoryStoryProps = {
  title: string;
  description?: string | null;
  quickCount: number;
  customCount: number;
};

export function CategoryStory({
  title,
  description,
  quickCount,
  customCount
}: CategoryStoryProps) {
  return (
    <div className="category-story">
      <div>
        <p className="section-kicker">Fast lunch favourites first</p>
        <h2>{title}</h2>
        <p>Ready-made picks stay first for a faster lunch.</p>
        {description ? <p className="category-story-note">{description}</p> : null}
      </div>
      <div className="category-story-stats" aria-label="Category summary">
        <span>{quickCount} quick pick{quickCount === 1 ? "" : "s"}</span>
        <span>{customCount} custom build{customCount === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
