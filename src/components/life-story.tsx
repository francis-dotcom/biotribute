"use client";

type LifeStoryProps = {
  paragraphs: string[];
};

export function LifeStory({ paragraphs }: LifeStoryProps) {
  const preview = paragraphs.slice(0, 2);
  const remaining = paragraphs.slice(2);

  return (
    <>
      <div className="story-stack">
        {preview.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {remaining.length > 0 ? (
        <>
          <input className="story-modal-toggle" id="life-story-modal" type="checkbox" />
          <label className="story-read-more" htmlFor="life-story-modal">
            Read more
          </label>

          <div className="story-modal-overlay">
            <label className="story-modal-backdrop" htmlFor="life-story-modal" />
            <div className="story-modal-card">
              <div className="story-modal-head">
                <div>
                  <p className="message-modal-kicker">Life Story</p>
                  <h3>More about this life</h3>
                </div>
                <label
                  className="message-modal-close"
                  htmlFor="life-story-modal"
                  aria-label="Close life story"
                >
                  ×
                </label>
              </div>
              <div className="story-stack story-modal-copy">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
