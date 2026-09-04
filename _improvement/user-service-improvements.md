# Improvements for `UserService`

## Analysis
The current implementation of `UserService` is clean and follows the project's architectural patterns. However, there are a few areas where robustness and maintainability can be enhanced.

### 🚩 Key Areas for Improvement

1. **Missing Existence Check in `getUser`**: Unlike `deleteUser`, `getUser` doesn't check if the user exists before attempting to sanitize it. This can lead to `null` being returned instead of a proper `404 Not Found` response.
2. **Code Duplication (Sanitization)**: The `plainToInstance` transformation to `UserResponseDto` is repeated in `getAllUsers` and `getUser`.
3. **Inconsistent Error Handling in `deleteUser`**: 
    - Failures in **AWS Rekognition** block the entire deletion process.
    - Failures in **Cloudinary** are logged but do not block deletion.
    - *Recommendation*: Standardize the behavior. Typically, account deletion should prioritize the database record removal and handle cloud cleanup as a non-blocking or background task.
4. **Type Safety & Return Values**:
    - `getUser` and `deleteUser` lack explicit return type annotations.
    - `deleteUser` returns a hardcoded string message, which is better handled at the Controller layer.

## 🛠 Suggested Refactor

```typescript
@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(USER_TYPES.Repository)
        private userRepository: IUserRepository,
        @inject(ADAPTER_TYPES.AwsRekognitionService)
        private awsRekognitionService: IAwsRekognitionService,
        @inject(ADAPTER_TYPES.CloudinaryService)
        private cloudinaryService: ICloudinaryService,
    ) {}

    private mapToResponseDto(user: any): UserResponseDto {
        return plainToInstance(UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }

    async getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
        const { content, total } = await this.userRepository.findAll(query);
        
        return {
            content: content.map(user => this.mapToResponseDto(user)),
            page: query.page,
            size: query.size,
            totalPages: Math.ceil(total / query.size),
            totalElements: total,
        };
    }

    async getUser(id: string): Promise<UserResponseDto> {
        const result = await this.userRepository.findUser(id);
        if (!result) {
            throw new NotFoundException("User not found");
        }
        return this.mapToResponseDto(result);
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // 1. Clean up AWS Rekognition
        if (user.kyc?.faceId) {
            try {
                await this.awsRekognitionService.deleteFacesFromCollection(
                    AwsCollectionId.USERS,
                    [user.kyc.faceId],
                );
            } catch (awsError) {
                pinoLogger.error({ awsError, userId: id, faceId: user.kyc.faceId }, "AWS Rekognition cleanup failed");
                // Decided: Log and continue to ensure user can be deleted from DB
            }
        }

        // 2. Clean up Cloudinary
        if (user.livenessImagePublicId) {
            try {
                await this.cloudinaryService.destroy(user.livenessImagePublicId);
            } catch (cloudinaryError) {
                pinoLogger.error({ cloudinaryError, userId: id, publicId: user.livenessImagePublicId }, "Cloudinary cleanup failed");
            }
        }

        await this.userRepository.deleteUser(id);
    }
}
```
