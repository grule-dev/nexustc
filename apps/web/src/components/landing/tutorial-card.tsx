import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function TutorialCard({
  tutorial,
}: {
  tutorial: { title: string; description: string; embedUrl: string };
}) {
  return (
    <Card key={tutorial.title}>
      <CardHeader>
        <CardTitle>{tutorial.title}</CardTitle>
        <CardDescription>{tutorial.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={tutorial.embedUrl}
          title="YouTube video player"
        />
      </CardContent>
    </Card>
  );
}
