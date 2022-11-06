import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { map, Observable } from 'rxjs';
import { CovidDto } from 'src/DTO/covid.dto';
import { CovidEntity } from 'src/Entity/covid.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CovidService {
  private url: string =
    'https://public.opendatasoft.com/api/records/1.0/search/?dataset=covid-19-germany-landkreise&q=ludwigshafen&facet=last_update&facet=name&facet=rs&facet=bez&facet=bl&refine.name=Ludwigshafen+am+Rhein';

  constructor(
    private httpService: HttpService,
    @InjectRepository(CovidEntity) private repo: Repository<CovidEntity>,
  ) {}

  getTodaysCovidData(): Observable<CovidDto> {
    return this.httpService.get(this.url).pipe(
      map((response) => response.data),
      map((data) => ({
        id: data.records[0].recordid,
        last_update: data.records[0].fields.last_update,
        total_cases: data.records[0].fields.cases,
        total_deaths: data.records[0].fields.deaths,
        incidence: data.records[0].fields.cases7_per_100k,
      })),
    );
  }

  setTodaysCovidData(covidDto: Observable<CovidDto>) {
    let covid: CovidEntity = new CovidEntity();
    covidDto.subscribe(async (data: CovidDto) => {
      covid.id = data.id;
      covid.last_update = data.last_update;
      covid.total_cases = data.total_cases;
      covid.total_deaths = data.total_deaths;
      covid.incidence = data.incidence;

      console.log(covid);

      this.repo.create(covid);

      try {
        return await this.repo.save(covid);
      } catch (error) {
        throw new InternalServerErrorException(
          'Something went wrong. Covid-Data not saved',
        );
      }
    });
  }
}
