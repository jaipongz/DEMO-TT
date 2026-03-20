import React from 'react';

export default function DemoJpForm() {
  return (
    <form>
  <div className="field-row">
  <label>Title (text)</label><br />
  <input type="text" name="title" />
      </div>
  <div className="field-row">
  <label>Email (email)</label><br />
  <input type="email" name="email" />
      </div>
  <div className="field-row">
  <label>Age (number)</label><br />
  <input type="number" name="age" />
      </div>
  <div className="field-row">
  <label>Brand Color (color)</label><br />
  <input type="text" name="brand_color" />
      </div>
  <div className="field-row">
  <label>Published Date (date)</label><br />
  <input type="date" name="published_date" />
      </div>
  <div className="field-row">
  <label>Published At (datetime)</label><br />
  <input type="datetime-local" name="published_at" />
      </div>
  <div className="field-row">
  <label>Category (dropdown + lookup)</label><br />
  <input type="select" name="category" />
      </div>
  <div className="field-row">
  <label>Province (dynamic lookup)</label><br />
  <input type="select" name="province" />
      </div>
  <div className="field-row">
  <label>Article (dynamic lookup)</label><br />
  <input type="select" name="article" />
      </div>
  <div className="field-row">
  <label>Home Banner Tags (tag lookup)</label><br />
  <input type="select" name="home_banner_tags" />
      </div>
  <div className="field-row">
  <label>Status (radio + lookup)</label><br />
  <input type="select" name="status" />
      </div>
  <div className="field-row">
  <label>Flags (checkbox + lookup)</label><br />
  <input type="select" name="flags" />
      </div>
  <div className="field-row">
  <label>Is Active (switch)</label><br />
  <input type="select" name="is_active" />
      </div>
  <div className="field-row">
  <label>Summary (moretext)</label><br />
  <textarea name="summary" />
      </div>
  <div className="field-row">
  <label>Content (fulltext)</label><br />
  <textarea name="content" />
      </div>
  <div className="field-row">
  <label>Thumbnail (image)</label><br />
  <input type="text" name="thumbnail" />
      </div>
  <div className="field-row">
  <label>Intro Video (video)</label><br />
  <input type="text" name="intro_video" />
      </div>
  <div className="field-row">
  <label>Attachment (file)</label><br />
  <input type="text" name="attachment" />
      </div>

      <button type="submit">Save</button>
    </form>
  );
}
