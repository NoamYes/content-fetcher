import { IsArray, IsString, IsUrl, ArrayMinSize } from 'class-validator';

export class FetchUrlsDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({}, { each: true })
    urls: string[];
}
