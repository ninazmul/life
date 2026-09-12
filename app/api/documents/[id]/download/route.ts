import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const auth = await getLifeAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await LifeDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Permission check: Owner/Admin or assigned/related person
    const isOwnerOrAdmin = auth.isOwner || auth.isAdmin;
    const isAssigned =
      auth.personId &&
      (doc.relatedPersonId?.toString() === auth.personId ||
        doc.assignedToPersonIds?.some(
          (p: { toString(): string }) => p.toString() === auth.personId
        ));

    if (!isOwnerOrAdmin && !isAssigned) {
      await logLifeActivity({
        action: "DOCUMENT_DOWNLOAD_DENIED",
        resourceType: "Document",
        resourceId: doc._id.toString(),
        resourceName: doc.title,
        details: `Unauthorized attempt to access document "${doc.title}"`,
        result: "denied",
        isCritical: true,
      });
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this document" },
        { status: 403 }
      );
    }

    // Log successful download
    await logLifeActivity({
      action: "DOCUMENT_DOWNLOAD",
      resourceType: "Document",
      resourceId: doc._id.toString(),
      resourceName: doc.title,
      details: `Downloaded document "${doc.title}" (${doc.category})`,
      result: "success",
    });

    const fileUrl = doc.fileUrl;
    if (!fileUrl) {
      return NextResponse.json({ error: "No file content available" }, { status: 404 });
    }

    // If Base64 Data URL
    if (fileUrl.startsWith("data:")) {
      const commaIdx = fileUrl.indexOf(",");
      if (commaIdx !== -1) {
        const meta = fileUrl.slice(5, commaIdx);
        const [mimePart] = meta.split(";");
        const mime = mimePart || doc.fileType || "application/octet-stream";
        const base64Data = fileUrl.slice(commaIdx + 1);
        const buffer = Buffer.from(base64Data, "base64");

        const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.${mime.split("/")[1] || "bin"}`;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // If external or absolute URL
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return NextResponse.redirect(fileUrl);
    }

    // Local file path or relative URL
    return NextResponse.redirect(new URL(fileUrl, request.url));
  } catch (error) {
    console.error("Failed to download document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
