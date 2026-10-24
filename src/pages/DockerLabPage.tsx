import { useParams } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { DockerLabRunner } from "@/components/docker-lab/DockerLabRunner";

export default function DockerLabPage() {
  const { levelId } = useParams();
  const id = parseInt(levelId || "1", 10);

  return (
    <LabLayout>
      <DockerLabRunner levelId={id} />
    </LabLayout>
  );
}
