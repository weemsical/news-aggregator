import "./HowItWorks.css";

export function HowItWorks() {
  return (
    <div className="how-it-works">
      <h2 className="how-it-works__title">How It Works</h2>

      <section className="how-it-works__section">
        <h3>What is this?</h3>
        <p>
          News articles are full of spin — loaded language, emotional framing,
          and editorial slant designed to shape how you think. Most of the time,
          you don't notice because you already know the source and bring your own
          biases to the reading.
        </p>
        <p>
          <strong>I Call BullShit</strong> strips all of that away. Every article
          you see here has been scrubbed of its source, author, and branding. You
          don't know if you're reading Fox News or CNN, the AP or the New York
          Post. All you have is the words on the page.
        </p>
      </section>

      <section className="how-it-works__section">
        <h3>Your job</h3>
        <p>
          Read an article. When you spot a passage that you think is propaganda —
          loaded language, emotional manipulation, unsupported claims, misleading
          framing — select the text and mark it. Write a brief explanation of
          what you see.
        </p>
        <p>
          Your highlights are saved and visible the next time you visit. Toggle
          between your highlights and everyone else's to see what others are
          catching that you might have missed.
        </p>
      </section>

      <section className="how-it-works__section">
        <h3>Why sign up?</h3>
        <p>
          You can read articles without an account. But creating one lets you:
        </p>
        <ul>
          <li>Highlight passages and explain why you think they're propaganda</li>
          <li>Edit or delete your highlights</li>
          <li>See other logged-in users' highlights in blue</li>
          <li>Have your highlights count toward source credibility scores</li>
        </ul>
      </section>

      <section className="how-it-works__section">
        <h3>What happens with the data?</h3>
        <p>
          Every highlight from logged-in users feeds into a scoring system. The
          more people who independently flag the same passage, the stronger the
          signal. These scores are aggregated by source — and the scores page is
          the <em>only</em> place where source names are ever revealed.
        </p>
        <p>
          The goal isn't to tell you which sources are "bad." It's to build a
          collective picture of where propaganda techniques appear most often,
          based on what real readers catch when they can't see the logo.
        </p>
      </section>

      <section className="how-it-works__section">
        <h3>Tips for spotting propaganda</h3>
        <ul>
          <li><strong>Loaded language</strong> — words chosen to trigger an emotional reaction rather than inform ("slammed," "radical," "devastating")</li>
          <li><strong>Unattributed claims</strong> — "critics say," "sources report," "many believe" with no specifics</li>
          <li><strong>False balance</strong> — presenting a fringe view as equally valid to the consensus</li>
          <li><strong>Emotional framing</strong> — leading with an anecdote designed to provoke rather than inform</li>
          <li><strong>Omission</strong> — what the article doesn't mention can be as telling as what it does</li>
          <li><strong>Labeling</strong> — using terms like "extremist," "radical," or "mainstream" to shortcut your judgment</li>
        </ul>
      </section>
    </div>
  );
}
