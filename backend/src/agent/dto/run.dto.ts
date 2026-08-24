import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID, ValidateNested,
} from 'class-validator';

export class ClientToolSchemaDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsObject() input_schema: any;
}

/** POST /api/agent/stream */
export class StartRunDto {
  @IsOptional() @IsUUID() conversationId?: string;

  @IsString() message: string;

  /** Frontend apne browser-tools ke schemas yahan bhejta hai (Day 8, step 1) */
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ClientToolSchemaDto)
  clientTools?: ClientToolSchemaDto[];
}

export class ToolOutcomeDto {
  @IsString() toolCallId: string;
  @IsOptional() @IsBoolean() approved?: boolean;
  @IsOptional() @IsObject() args?: any;
  @IsOptional() result?: any;
  @IsOptional() @IsString() error?: string;
}

/** POST /api/agent/resume */
export class ResumeRunDto {
  @IsUUID() runId: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => ToolOutcomeDto)
  outcomes: ToolOutcomeDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ClientToolSchemaDto)
  clientTools?: ClientToolSchemaDto[];
}
