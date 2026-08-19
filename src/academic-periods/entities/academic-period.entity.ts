import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Check,
} from 'typeorm';

export enum EvaluationStage {
  ETAPA_1 = '1ª Etapa',
  ETAPA_2 = '2ª Etapa',
  EXAMEN_FINAL = 'Examen Final',
  RECUPERATORIO = 'Recuperatorio',
}

@Entity('academic_periods')
@Unique('UQ_academic_periods_year_name', ['year', 'name'])
@Check('CHK_academic_periods_date_order', `"startDate" <= "endDate"`)
export class AcademicPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
