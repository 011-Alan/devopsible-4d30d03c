import { useParams } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { JenkinsLabRunner } from "@/components/jenkins-lab/JenkinsLabRunner";

export default function JenkinsLabPage() {
  const { levelId } = useParams();
  const id = parseInt(levelId || "1", 10);

  return (
    <LabLayout>
      <JenkinsLabRunner levelId={id} />
    </LabLayout>
  );
}
