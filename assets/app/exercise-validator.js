window.ExerciseValidator = (() => {
  const DEFAULT_MESSAGE = 'O código correu, mas ainda não cumpre o objetivo.';

  function getChecks(exercise) {
    if (Array.isArray(exercise.checks) && exercise.checks.length) {
      return exercise.checks;
    }
    const byId = window.exerciseChecksById || {};
    return byId[exercise.id] || [];
  }

  function evaluate(exercise, code, state) {
    if (typeof exercise.validate !== 'function') {
      return { ok: false, message: 'Este exercício não tem validação configurada.' };
    }

    try {
      if (exercise.validate(code, state)) {
        return { ok: true };
      }
    } catch (error) {
      return { ok: false, message: `Erro na validação: ${error.message}` };
    }

    const checks = getChecks(exercise);
    for (const check of checks) {
      try {
        if (!check.test(code, state)) {
          return { ok: false, message: check.message };
        }
      } catch {
        return { ok: false, message: check.message };
      }
    }

    return {
      ok: false,
      message: exercise.validationHint || DEFAULT_MESSAGE,
    };
  }

  return { evaluate, getChecks };
})();
