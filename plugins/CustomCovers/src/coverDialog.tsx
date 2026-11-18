import { LunaButton, LunaTextSetting, confirm } from "@luna/ui";
import React from "react";

// Local images are scaled down so the stored data url stays small, tidal itself serves covers up to 1280x1280
const maxSize = 1280;

const readImageFile = (): Promise<string | undefined> =>
	new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (file === undefined) return resolve(undefined);
			const objectUrl = URL.createObjectURL(file);
			try {
				const image = new Image();
				image.src = objectUrl;
				await image.decode();
				const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
				const canvas = document.createElement("canvas");
				canvas.width = Math.round(image.naturalWidth * scale);
				canvas.height = Math.round(image.naturalHeight * scale);
				canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL("image/jpeg", 0.9));
			} catch (err) {
				reject(err);
			} finally {
				URL.revokeObjectURL(objectUrl);
			}
		};
		input.click();
	});

const isValidCover = (url?: string) => url !== undefined && /^(https?:\/\/\S+|data:image\/)/i.test(url);

const CoverInput = ({ initial, onChange }: { initial?: string; onChange: (url?: string) => void }) => {
	const [url, setUrl] = React.useState(initial?.startsWith("data:") ? "" : (initial ?? ""));
	const [fileUrl, setFileUrl] = React.useState(initial?.startsWith("data:") ? initial : undefined);
	const [fileError, setFileError] = React.useState<string>();
	const invalidUrl = url.trim() !== "" && !isValidCover(url.trim());
	return (
		<>
			<LunaTextSetting
				title="Image url"
				desc="Link to the image to use as the cover"
				value={url}
				error={invalidUrl}
				helperText={invalidUrl ? "Enter an http(s) link to an image" : undefined}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setUrl(e.target.value);
					setFileUrl(undefined);
					onChange(e.target.value.trim() || undefined);
				}}
			/>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					marginTop: 16,
				}}
			>
				<LunaButton
					onClick={async () => {
						setFileError(undefined);
						const dataUrl = await readImageFile().catch(() => setFileError("Could not read this image"));
						if (!dataUrl) return;
						setUrl("");
						setFileUrl(dataUrl);
						onChange(dataUrl);
					}}
				>
					Choose image file…
				</LunaButton>
				{fileError && <span style={{ color: "#f44336" }}>{fileError}</span>}
				{(fileUrl ?? (invalidUrl ? "" : url)) && (
					<img
						src={fileUrl ?? url}
						style={{
							width: 96,
							height: 96,
							objectFit: "cover",
							borderRadius: 4,
						}}
					/>
				)}
			</div>
		</>
	);
};

/** Asks for a cover url or local image, resolves undefined when cancelled */
export const askForCover = async (title: string, current?: string) => {
	let url = current;
	const { confirmed } = await confirm({
		title: `Custom cover for ${title}`,
		content: <CoverInput initial={current} onChange={(next) => (url = next)} />,
		confirmationText: "Save",
	});
	if (confirmed && isValidCover(url)) return url;
};
