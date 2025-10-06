import { IsArray, IsString, IsUrl, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FetchUrlsDto {
    @ApiProperty({
        description: 'Array of URLs to fetch',
        example: ['https://www.google.com', 'https://www.github.com', 'https://www.npmjs.com'],
        type: [String],
        minItems: 1,
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({}, { each: true })
    urls: string[];
}
