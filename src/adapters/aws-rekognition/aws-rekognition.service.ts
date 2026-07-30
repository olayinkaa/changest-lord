import { RekognitionClient } from "@aws-sdk/client-rekognition"
import { injectable } from "inversify"

@injectable()
export class AwsRekognition {
	private CONFIDENCE_THRESHOLD = 98
	private rekognitionClient: RekognitionClient

	constructor() {
		this.rekognitionClient = new RekognitionClient({
			region: process.env.AWS_REGION || "us-east-1",
		})
	}

	async compareFaces() {}
}
