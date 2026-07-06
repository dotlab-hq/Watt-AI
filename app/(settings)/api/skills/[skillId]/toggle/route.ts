import { auth } from "@/app/(auth)/auth";
import { getSkillById, toggleUserSkill } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const { skillId } = await params;

  const skill = await getSkillById({ id: skillId });
  if (!skill) {
    return new ChatbotError("not_found:api", "Skill not found").toResponse();
  }

  const { isEnabled } = await toggleUserSkill({
    userId: session.user.id,
    skillId,
  });

  return Response.json({ isEnabled });
}
