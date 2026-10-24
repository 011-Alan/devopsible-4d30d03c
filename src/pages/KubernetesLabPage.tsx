import { useParams } from "react-router-dom";
import { LabLayout } from "@/components/layout/LabLayout";
import { K8sLabRunner } from "@/components/k8s-lab/K8sLabRunner";

export default function KubernetesLabPage() {
  const { levelId } = useParams();
  const id = parseInt(levelId || "1", 10);

  return (
    <LabLayout>
      <K8sLabRunner levelId={id} />
    </LabLayout>
  );
}
