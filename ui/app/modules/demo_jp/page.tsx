import React from 'react';

export default function DemoJpList() {
  return (
    <div>
      <h1>DemoJp List</h1>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>title</th>
            <th>email</th>
            <th>age</th>
            <th>brand_color</th>
            <th>published_date</th>
            <th>published_at</th>
            <th>category</th>
            <th>province</th>
            <th>article</th>
            <th>home_banner_tags</th>
            <th>status</th>
            <th>flags</th>
            <th>is_active</th>
            <th>summary</th>
            <th>content</th>
            <th>thumbnail</th>
            <th>intro_video</th>
            <th>attachment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* TODO: map data */}
        </tbody>
      </table>
    </div>
  );
}
