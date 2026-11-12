import React, { useState } from 'react';
import { coursesForTrack, freeCourseCount, type Course } from '@kiyuv/content';
import { FAV_COLOR_THEMES, type KidProfile } from '@kiyuv/shared';
import { Pic } from '../../ui/Pic.js';
import { useModalFocus } from '../../ui/useModalFocus.js';
import { IconBack, IconLock } from '../../ui/Icons.js';
import { SUBJECT_COLORS } from './subjectColors.js';

/**
 * A short notice for a premium course. There is nothing to buy here yet and no price:
 * it only tells the child that a parent will be able to unlock the course later.
 */
export const PremiumNotice: React.FC<{ course: Course; total: number; onClose: () => void }> = ({
  course,
  total,
  onClose,
}) => {
  const ref = useModalFocus<HTMLDivElement>(onClose);
  return (
    <div className="modal-backdrop">
      <div
        className="modal-card premium-notice"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-title"
        ref={ref}
        tabIndex={-1}
      >
        <div className="premium-emoji" aria-hidden="true">
          <Pic emoji={course.emoji} />
        </div>
        <h2 id="premium-title">{course.name}</h2>
        <p className="premium-badge">
          <IconLock size={16} /> Kiyuv Premium
        </p>
        <p>
          This course is part of Kiyuv Premium, with {total} courses to explore. Premium is not open yet. A
          parent will be able to unlock more courses here soon.
        </p>
        <p className="premium-sub">The free courses are all yours to play right now!</p>
        <button type="button" className="primary-btn big" onClick={onClose} data-silent>
          OK
        </button>
      </div>
    </div>
  );
};

interface CoursesViewProps {
  profile: KidProfile;
  onBack: () => void;
  onStart: (courseId: string) => void;
}

/** Every bonus course for the child's track, grouped by subject. */
export const CoursesView: React.FC<CoursesViewProps> = ({ profile, onBack, onStart }) => {
  const [premiumCourse, setPremiumCourse] = useState<Course | null>(null);
  const theme = FAV_COLOR_THEMES[profile.favColor] ?? FAV_COLOR_THEMES.blue;
  const courses = coursesForTrack(profile.track);
  const free = freeCourseCount(profile.track);
  const groups = [...new Set(courses.map((c) => c.group))];

  return (
    <div className="courses-home" style={{ ['--run-color' as string]: theme.hex }}>
      <div className="courses-top">
        <button type="button" className="back-topics" onClick={onBack} aria-label="Back to the learn page">
          <IconBack size={22} />
          <span aria-hidden="true">Back</span>
        </button>
      </div>
      <h1 className="courses-title">Bonus courses</h1>
      <p className="courses-sub">
        {courses.length} courses to explore. {free} are free to play.
      </p>

      {groups.map((group, gi) => (
        <section key={group} className="course-group" aria-label={group}>
          <h2 className="section-title">{group}</h2>
          <ul className="game-grid">
            {courses
              .filter((c) => c.group === group)
              .map((c, i) => {
                const colors = SUBJECT_COLORS[(gi * 3 + i) % SUBJECT_COLORS.length]!;
                const best = profile.topics[c.id]?.b ?? 0;
                const status = c.free ? (best > 0 ? `Best ${best}/10` : 'New') : 'Premium';
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`game-card${c.free ? '' : ' premium'}`}
                      data-silent
                      style={{
                        ['--card-main' as string]: colors.main,
                        ['--card-text' as string]: colors.text,
                        ['--card-soft' as string]: colors.soft,
                      }}
                      onClick={() => (c.free ? onStart(c.id) : setPremiumCourse(c))}
                      aria-label={`${c.name}. ${c.blurb}. ${c.ages}. ${
                        c.free ? (best > 0 ? `Best score ${best} out of 10` : 'Not played yet') : 'Premium course'
                      }`}
                    >
                      <span className="game-emoji" aria-hidden="true">
                        <Pic emoji={c.emoji} />
                      </span>
                      <span className="game-name">{c.name}</span>
                      <span className="bonus-blurb">{c.blurb}</span>
                      <span className="course-ages">{c.ages}</span>
                      <span className="game-go">
                        {!c.free && <IconLock size={16} />} {status}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      {premiumCourse && (
        <PremiumNotice course={premiumCourse} total={courses.length} onClose={() => setPremiumCourse(null)} />
      )}
    </div>
  );
};
