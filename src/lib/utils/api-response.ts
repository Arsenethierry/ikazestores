/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { AppwriteErrorHandler } from "../errors/appwrite-errors";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        status?: number;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        offset?: number;
    };
}

export class ApiResponseHandler {
    static success<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse<ApiResponse<T>> {
        const response: ApiResponse<T> = {
            success: true,
            data,
            ...(meta && { meta })
        };

        return NextResponse.json(response, { status: 200 });
    }

    static error(error: unknown, statusCode?: number): NextResponse<ApiResponse> {
        const appwriteError = AppwriteErrorHandler.handle(error);

        const response: ApiResponse = {
            success: false,
            error: {
                message: appwriteError.message,
                code: appwriteError.code,
                status: appwriteError.status
            }
        };

        return NextResponse.json(response, {
            status: statusCode || appwriteError.status
        });
    }

    static notFound(message: string = 'Resource not found'): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'NOT_FOUND',
                status: 404
            }
        };

        return NextResponse.json(response, { status: 404 });
    }

    static badRequest(message: string = 'Bad request'): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'BAD_REQUEST',
                status: 400
            }
        };

        return NextResponse.json(response, { status: 400 });
    }

    static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'UNAUTHORIZED',
                status: 401
            }
        };

        return NextResponse.json(response, { status: 401 });
    }

    static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'FORBIDDEN',
                status: 403
            }
        };

        return NextResponse.json(response, { status: 403 });
    }

    static validationError(message: string = 'Validation failed', details?: any): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'VALIDATION_ERROR',
                status: 422,
                ...(details && { details })
            }
        };

        return NextResponse.json(response, { status: 422 });
    }

    static internalError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
        const response: ApiResponse = {
            success: false,
            error: {
                message,
                code: 'INTERNAL_ERROR',
                status: 500
            }
        };

        return NextResponse.json(response, { status: 500 });
    }

    static created<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse<ApiResponse<T>> {
        const response: ApiResponse<T> = {
            success: true,
            data,
            ...(meta && { meta })
        };

        return NextResponse.json(response, { status: 201 });
    }

    static noContent(): NextResponse {
        return new NextResponse(null, { status: 204 });
    }

    static paginated<T>(
        data: T[],
        total: number,
        page: number,
        limit: number
    ): NextResponse<ApiResponse<T[]>> {
        const response: ApiResponse<T[]> = {
            success: true,
            data,
            meta: {
                total,
                page,
                limit,
                offset: (page - 1) * limit
            }
        };

        return NextResponse.json(response, { status: 200 });
    }

    static async handle<T>(
        operation: () => Promise<T>,
        successStatus: number = 200
    ): Promise<NextResponse<ApiResponse<T>>> {
        try {
            const result = await operation();
            return NextResponse.json(
                { success: true, data: result },
                { status: successStatus }
            );
        } catch (error) {
            return this.error(error);
        }
    }
}