import {
  PostActionBar,
  PostContent,
  PostHero,
  type PostProps,
} from "./post-components";

export function GamePage({ post }: { post: PostProps }) {
  return (
    <div className="flex flex-col gap-8">
      <PostHero post={post} />
      <PostActionBar post={post} />
      <PostContent post={post} />
    </div>
  );
}
